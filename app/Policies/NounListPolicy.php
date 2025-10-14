<?php

namespace App\Policies;

use App\Models\User;
use App\Models\NounList;

class NounListPolicy
{
    /**
     * Determine if the user can view the noun list.
     */
    public function view(User $user, NounList $nounList): bool
    {
        return $user->id === $nounList->user_id;
    }

    /**
     * Determine if the user can update the noun list.
     */
    public function update(User $user, NounList $nounList): bool
    {
        return $user->id === $nounList->user_id;
    }

    /**
     * Determine if the user can delete the noun list.
     */
    public function delete(User $user, NounList $nounList): bool
    {
        return $user->id === $nounList->user_id;
    }
}
