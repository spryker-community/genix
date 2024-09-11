FROM volhovm/spryker-8.2-alpine-3.19

RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    nodejs \
    npm \
    curl \
    bash \
    libc6-compat

RUN apk add --no-cache nodejs npm vim htop

RUN npm install -g npm@latest

RUN npm install -g typescript tsx

ENV NODE_WORKING_DIR /data

#RUN /usr/bin/install -d -m 777 /var/run/opcache/debug
#COPY docker/debug/etc/php/debug.conf.d/ /usr/local/etc/php/conf.d/
USER root

WORKDIR /data