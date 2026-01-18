# waiwaichan

Build the docker image
```
docker compose -f ./environment/development/docker-compose.yml build --no-cache
```

Start the server locally
```
docker compose -f ./environment/development/docker-compose.yml up
```

How to enter into the environment
```
docker compose -f ./environment/development/docker-compose.yml exec -it backend sh
```

How to execute test in the environment
```
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm test'
```

How to execute specific test in the environment
```
pnpm test tests/IntegrationTests/TalkCommands.test.ts -- --grep "test name"
```

How to execute the QA with Coverage
```
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm test:coverage'
```

How to execute the migrate up
```
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm migrateAll:up'
```

How to execute the migrate down
```
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm migrateAll:down'
```

Running formatter && linter
```
pnpm lint
```

Running formatter && linter (unsafe) https://biomejs.dev/linter/#unsafe-fixes
```
pnpm lint:unsafe
```
