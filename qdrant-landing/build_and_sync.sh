#!/bin/bash

hugo -b 'https://demo-landing.qdrant.tech/'

rsync -avP ./public/ $1:./project/web-deployment/public/landing_demo/
