<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    return view('app'); // Loads resources/views/app.blade.php
})->where('any', '.*');