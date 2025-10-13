<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VerbList;

class VerbListPolicy
{
    /**
     * Determine if the user can view the verb list.
     */
    public function view(User $user, VerbList $verbList): bool
    {
        return $user->id === $verbList->user_id;
    }

    /**
     * Determine if the user can update the verb list.
     */
    public function update(User $user, VerbList $verbList): bool
    {
        return $user->id === $verbList->user_id;
    }

    /**
     * Determine if the user can delete the verb list.
     */
    public function delete(User $user, VerbList $verbList): bool
    {
        return $user->id === $verbList->user_id;
    }
}
