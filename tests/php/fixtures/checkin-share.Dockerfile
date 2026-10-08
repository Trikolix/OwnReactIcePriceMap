FROM php:8.3-cli
RUN apt-get update && apt-get install -y --no-install-recommends libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev libonig-dev fonts-dejavu-core \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j2 gd pdo_mysql mbstring \
    && rm -rf /var/lib/apt/lists/*
