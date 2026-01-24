# waiwaichan

Build the docker image
```
# development
docker compose -f ./environment/development/docker-compose.yml build --no-cache

# staging
docker compose -f ./environment/staging/docker-compose.yml build --no-cache
```

Start the server locally
```
# development
docker compose -f ./environment/development/docker-compose.yml up

# staging
docker compose -f ./environment/staging/docker-compose.yml up
```

How to enter into the environment
```
# development only
docker compose -f ./environment/development/docker-compose.yml exec -it backend sh
```

How to execute test in the environment
```
# development only
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm test'
```

How to execute migrate in the environment
```
# development only
docker compose -f ./environment/development/docker-compose.yml up migrate
```

How to execute specific test in the environment
```
# development only
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm test tests/IntegrationTests/TalkCommands.test.ts -- --grep "test name"'
```

How to execute the QA with Coverage
```
# development only
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm test:coverage'
```

How to execute the migrate up
```
# development only
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm migrateAll:up'
```

How to execute the migrate down
```
# development only
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm migrateAll:down'
```

Running formatter && linter
```
# local
pnpm lint
```

Running formatter && linter (unsafe) https://biomejs.dev/linter/#unsafe-fixes
```
# local
pnpm lint:unsafe
```
