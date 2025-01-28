<?php

namespace App\Console\Commands;

use App\Models\AdminUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create {name} {email} {password}';
    protected $description = 'Create a new admin user';

    public function handle()
    {
        $validator = Validator::make($this->arguments(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admin_users'],
            'password' => ['required', 'string', Password::defaults()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return 1;
        }

        try {
            $admin = AdminUser::create([
                'name' => $this->argument('name'),
                'email' => $this->argument('email'),
                'password' => Hash::make($this->argument('password')),
            ]);

            $this->info("Admin user '{$admin->name}' created successfully!");
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to create admin user: ' . $e->getMessage());
            return 1;
        }
    }
}
