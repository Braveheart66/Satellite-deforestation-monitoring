#!/usr/bin/env bash
set -e

apt-get update
apt-get install -y \
  gdal-bin \
  libgdal-dev \
  libproj-dev \
  proj-data \
  proj-bin

pip install --upgrade pip

# 🔥 FORCE REMOVE GUI OpenCV IF PRESENT
pip uninstall -y opencv-python opencv-contrib-python || true

# Install correct dependencies
pip install -r requirements.txt
