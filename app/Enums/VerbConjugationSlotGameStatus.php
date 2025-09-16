<?php

namespace App\Enums;

enum VerbConjugationSlotGameStatus: string
{
    case WAITING = 'waiting';
    case IN_PROGRESS = 'in_progress';
    case ENDED = 'ended';
}
