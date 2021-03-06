<?php declare(strict_types=1);

namespace PeeHaa\MailGrab\Http\Command;

use Amp\Promise;
use PeeHaa\AmpWebsocketCommand\Command;
use PeeHaa\AmpWebsocketCommand\Input;
use PeeHaa\AmpWebsocketCommand\Success;
use function Amp\call;

class DeleteNotification implements Command
{
    public function execute(Input $input): Promise
    {
        return call(function() use ($input) {
            return new Success([
                'command' => 'deleteNotification',
                'id'      => $input->getParameter('id'),
            ]);
        });
    }
}
