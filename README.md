# waiwaichan

Start the server locally
```
docker-compose up
```

How to enter the environment
```
docker-compose exec backend sh
```

Execute the migration
```
npm run migrate
```

Insert seed data
```
npm run seed
```

Running formatter && linter
```
npm run lint
```

Running formatter && linter (unsafe) https://biomejs.dev/linter/#unsafe-fixes
```
npm run lint:unsafe
```
