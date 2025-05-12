#!/bin/bash
# Custom watch script to ignore runtime directories
cargo watch -x "run --no-default-features" -i "D:/PrinterOutput/*"