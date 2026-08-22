from __future__ import annotations

import hashlib
import importlib.util
import tempfile
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_SCRIPT = ROOT / "scripts" / "package.py"
spec = importlib.util.spec_from_file_location("search_restore_package", PACKAGE_SCRIPT)
assert spec and spec.loader
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)

listed = package.package_files()
actual = sorted(
    path.relative_to(ROOT / "extension").as_posix()
    for path in (ROOT / "extension").rglob("*")
    if path.is_file()
)
assert listed == actual, "package-files.txt must name every extension file exactly once"

with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
    first_zip, first_checksum, first_digest = package.build(Path(first_dir))
    second_zip, second_checksum, second_digest = package.build(Path(second_dir))

    first_bytes = first_zip.read_bytes()
    second_bytes = second_zip.read_bytes()
    assert first_bytes == second_bytes, "two clean package builds produced different ZIP bytes"
    assert first_digest == second_digest == hashlib.sha256(first_bytes).hexdigest()
    assert first_checksum.read_text(encoding="ascii") == f"{first_digest}  {first_zip.name}\n"
    assert second_checksum.read_text(encoding="ascii") == f"{second_digest}  {second_zip.name}\n"

    with ZipFile(first_zip) as bundle:
        assert bundle.namelist() == listed
        assert bundle.namelist()[listed.index("manifest.json")] == "manifest.json"
        assert all(info.date_time == package.FIXED_TIME for info in bundle.infolist())
        assert all(not PurePosixPath(name).is_absolute() and ".." not in PurePosixPath(name).parts for name in bundle.namelist())
        for name in listed:
            assert bundle.read(name) == (ROOT / "extension" / Path(*PurePosixPath(name).parts)).read_bytes()

print(f"ok, deterministic package contents passed ({first_digest})")
