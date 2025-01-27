<?php

use App\Http\Controllers\WaitlistController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/waitlist/subscribe', [WaitlistController::class, 'subscribe']);

Route::middleware('auth:sanctum')->group(function () {
    // API routes
});
