# use latest version of node
FROM mhart/alpine-node:latest

# build args
ARG S3_BUCKET
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

# node env
ENV S3_BUCKET=${S3_BUCKET} \
    AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
    AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

RUN echo "S3_BUCKET: $S3_BUCKET AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"

# set working directory
WORKDIR /dist

# bundle source code
COPY . /dist

# inatall application dependencies
RUN npm install

# expose applcation port
EXPOSE 3000

# run commands inside container
CMD ["npm", "start"]