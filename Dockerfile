FROM ubuntu:yakkety
MAINTAINER Jan Blaha
EXPOSE 8000

RUN apt-get update && apt-get install -y curl sudo && \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get install -y nodejs libgtk2.0-dev libxtst-dev libxss1 libgconf2-dev libnss3-dev libasound2-dev xvfb

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production

COPY . /usr/src/app

COPY patch /usr/src/app

HEALTHCHECK CMD curl --fail http://localhost:8000 || exit 1

CMD Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 & export DISPLAY=:9.0 && node index.js