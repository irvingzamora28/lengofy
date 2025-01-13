#!/bin/sh

envsubst '${SERVER_NAME}' < /nginx/default.conf.template > /nginx/default.conf
