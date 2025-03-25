npm install
composer install
cp .env.example .env

create bootstrap\cache - make writeable
php artisan key:generate

mkdir storage\framework\views -Force
mkdir storage\framework\sessions -Force
mkdir storage\framework\cache -Force

icacls storage /grant Everyone:F /T
icacls bootstrap/cache /grant Everyone:F /T


php artisan migrate
php artisan key:generate

php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
php artisan optimize
