# waiwaichan

Start the server locally
```
docker compose -f ./environment/development/docker-compose.yml up
```

How to enter the environment
```
docker compose -f ./environment/development/docker-compose.yml exec -it backend sh
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