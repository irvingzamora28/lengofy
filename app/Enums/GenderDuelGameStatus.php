<?php

namespace App\Enums;

enum GenderDuelGameStatus: string
{
    case WAITING = 'waiting';
    case IN_PROGRESS = 'in_progress';
    case ENDED = 'ended';
}
