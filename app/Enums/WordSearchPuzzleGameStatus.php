<?php

namespace App\Enums;

enum WordSearchPuzzleGameStatus: string
{
    case WAITING = 'waiting';
    case IN_PROGRESS = 'in_progress';
    case ENDED = 'ended';
}
