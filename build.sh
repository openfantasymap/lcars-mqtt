#!/bin/sh

docker buildx build --load -t sirmmo/edway-mgmt:latest -f Dockerfile . && docker push sirmmo/edway-mgmt:latest
