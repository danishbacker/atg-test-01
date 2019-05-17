# use latest version of node
FROM mhart/alpine-node:latest

# Set env
ENV S3_BUCKET=$S3_BUCKET

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