#!/bin/bash
git config user.name "Github Actions"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git add data/*.json &&
    git add -f "img/*.png" &&
    git commit -m "Update" &&
    git push origin main &&
    echo "Done" || echo "No Changes"
