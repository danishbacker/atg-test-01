FROM nginx:latest

LABEL maintainer="danishbacker@gmail.com"

COPY ./.docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80