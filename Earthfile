VERSION 0.7
FROM earthly/dind:alpine-3.18
WORKDIR remult-cli
RUN apk add nodejs npm

deps:
    COPY package.json pnpm-lock.yaml ./
    RUN npm install -g pnpm
    RUN pnpm install
    COPY tsconfig.json .eslintrc .eslintignore ./
    COPY src src

build:
    FROM +deps
    RUN pnpm build
    SAVE ARTIFACT dist /dist AS LOCAL dist

lint:
    FROM +deps
    RUN pnpm lint

test-setup:
    FROM +deps
    COPY integration integration


test:
    FROM +test-setup
    COPY docker-compose.yml ./ 
    COPY +build/dist ./dist
    WITH DOCKER --compose docker-compose.yml
        RUN while ! docker exec local_pgdb pg_isready; do sleep 1; done ;\ 
            pnpm test:ci
    END


all:
    BUILD +build
    BUILD +lint
    BUILD +test