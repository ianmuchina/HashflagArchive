#!/bin/bash
set -x
set -e

sudo apt update && sudo apt-get install -y wget2

# Download new images using http2 
wget2 --no-clobber -P img/ -i tmp/new_urls

# Verify all images exist
wget --no-clobber -P img/ -i tmp/all_urls

# Optimize Images
sudo apt update && sudo apt-get install -y optipng
git ls-files img/ -o | xargs -I {}  optipng -nb -nc {}