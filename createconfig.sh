PROJECT_ID="waiwai-406106"
VERSION="latest"

SECRET_ACCOUNTS="waiwaichan-accounts"
SECRET_CONFIG="waiwaichan-config"
SECRET_DATABASE="waiwaichan-database"
SECRET_KEY="waiwaichan-key"

rm /app/waiwaichan/config/accounts.json
gcloud secrets versions access $VERSION \
--secret="${SECRET_ACCOUNTS}" \
--project="${PROJECT_ID}" \
> /app/waiwaichan/config/accounts.json

rm /app/waiwaichan/config/config.json
gcloud secrets versions access $VERSION \
--secret="${SECRET_CONFIG}" \
--project="${PROJECT_ID}" \
> /app/waiwaichan/config/config.json

rm /app/waiwaichan/config/database.json
gcloud secrets versions access $VERSION \
--secret="${SECRET_DATABASE}" \
--project="${PROJECT_ID}" \
> /app/waiwaichan/config/database.json

rm /app/waiwaichan/config/key.json
gcloud secrets versions access $VERSION \
--secret="${SECRET_KEY}" \
--project="${PROJECT_ID}" \
> /app/waiwaichan/config/key.json
