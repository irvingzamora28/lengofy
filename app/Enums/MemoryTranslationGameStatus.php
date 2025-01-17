<?php

namespace App\Enums;

enum MemoryTranslationGameStatus: string
{
    case WAITING = 'waiting';
    case IN_PROGRESS = 'in_progress';
    case ENDED = 'ended';
}
