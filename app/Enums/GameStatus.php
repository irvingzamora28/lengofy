<?php

namespace App\Enums;

enum GameStatus: string
{
    case WAITING = 'waiting';
    case IN_PROGRESS = 'in_progress';
    case ENDED = 'ended';
}
