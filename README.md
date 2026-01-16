# waiwaichan

Build the docker image
```
docker compose -f ./environment/development/docker-compose.yml build --no-cache
```

Start the server locally
```
docker compose -f ./environment/development/docker-compose.yml up
```

How to enter the environment
```
docker compose -f ./environment/development/docker-compose.yml exec -it backend sh
```

How to execute test the environment
```
docker compose -f environment/development/docker-compose.yml exec -T backend sh -c 'pnpm test'
```

Execute the migration
```
pnpm migrate up
```

Execute the rollback
```
pnpm migrate down
```

Insert seed data
```
pnpm seed up
```

Running formatter && linter
```
pnpm lint
```

Running formatter && linter (unsafe) https://biomejs.dev/linter/#unsafe-fixes
```
pnpm lint:unsafe
```

Execute the QA
```
pnpm test
```

Execute the QA with Coverage
```
pnpm test:coverage
```