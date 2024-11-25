# waiwaichan

Start the server locally
```
docker compose -f ./environment/development/docker-compose.yml up
```

How to enter the environment
```
docker exec -it backend sh
```

Execute the migration
```
pnpm migrate up
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
