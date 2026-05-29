#!/bin/sh

docker buildx build --load -t ofdistantworlds/lcars-mqtt:latest -f Dockerfile . && docker push ofdistantworlds/lcars-mqtt:latest
