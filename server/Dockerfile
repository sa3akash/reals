# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM node:alpine AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json package-lock.json /temp/dev/
RUN cd /temp/dev && npm install

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json package-lock.json /temp/prod/
RUN cd /temp/prod && npm install --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
RUN npm run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/package.json .

# run the app
USER node
EXPOSE 5000/tcp
CMD [ "npm", "run", "start" ]