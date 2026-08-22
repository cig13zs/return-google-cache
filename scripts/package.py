from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "extension"
FILE_LIST = ROOT / "scripts" / "package-files.txt"
FIXED_TIME = (2000, 1, 1, 0, 0, 0)


def package_files() -> list[str]:
    names = [line.strip() for line in FILE_LIST.read_text(encoding="utf-8").splitlines() if line.strip()]
    if names != sorted(names):
        raise ValueError("package-files.txt must be sorted")
    if len(names) != len(set(names)):
        raise ValueError("package-files.txt contains duplicate paths")

    extension_root = EXTENSION.resolve()
    for name in names:
        relative = PurePosixPath(name)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError(f"unsafe package path: {name}")
        source = (EXTENSION / Path(*relative.parts)).resolve()
        if extension_root not in source.parents or not source.is_file():
            raise FileNotFoundError(f"missing package file: {name}")
    return names


def build(output_dir: Path) -> tuple[Path, Path, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))
    archive = output_dir / f"search-restore-{manifest['version']}.zip"

    with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as bundle:
        for name in package_files():
            source = EXTENSION / Path(*PurePosixPath(name).parts)
            info = ZipInfo(name, FIXED_TIME)
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, source.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)

    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    checksum = output_dir / f"{archive.name}.sha256"
    checksum.write_text(f"{digest}  {archive.name}\n", encoding="ascii", newline="\n")
    return archive, checksum, digest


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the deterministic Search Restore release ZIP.")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    archive, checksum, digest = build(args.output_dir.resolve())
    print(f"ZIP={archive}")
    print(f"SHA256={digest}")
    print(f"CHECKSUM={checksum}")


if __name__ == "__main__":
    main()
