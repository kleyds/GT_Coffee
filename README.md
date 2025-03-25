# GT_Coffee
Mini-app for hiring process

npm install
composer install
cp .env.example .env
create - bootstrap/cache - make writeable
php artisan key:generate

mkdir storage\framework\views -Force
mkdir storage\framework\sessions -Force
mkdir storage\framework\cache -Force

php artisan migrate

php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
php artisan optimize