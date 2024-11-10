# waiwaichan

Start the server locally
```
docker-compose up
```

How to enter the environment
```
docker-compose exec backend sh
```

Performing the migration
```
node_modules/.bin/sequelize db:migrate --env development
```

Running formatter && linter
```
npm run lint
```

Running formatter && linter (unsafe) https://biomejs.dev/linter/#unsafe-fixes
```
npm run lint:unsafe
```
