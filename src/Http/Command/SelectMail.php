<?php declare(strict_types=1);

namespace PeeHaa\MailGrab\Http\Command;

use Amp\Promise;
use PeeHaa\AmpWebsocketCommand\Command;
use PeeHaa\AmpWebsocketCommand\Input;
use PeeHaa\AmpWebsocketCommand\Success;
use PeeHaa\MailGrab\Http\Storage\Storage;
use function Amp\call;

class SelectMail implements Command
{
    private $storage;

    public function __construct(Storage $storage)
    {
        $this->storage = $storage;
    }

    public function execute(Input $input): Promise
    {
        return call(function() use ($input) {
            return new Success([
                'command' => 'mailInfo',
                'info'    => $this->getInfo($input->getParameter('id')),
            ]);
        });
    }

    private function getInfo(string $id): array
    {
        if (!$this->storage->has($id)) {
            return [
                'id'      => $id,
                'deleted' => true,
            ];
        }

        $mail = $this->storage->get($id);

        $mail->setRead();

        return [
            'id'          => $mail->getId(),
            'from'        => $mail->getFrom(),
            'to'          => $mail->getTo(),
            'cc'          => $mail->getCc(),
            'bcc'         => $mail->getBcc(),
            'subject'     => $mail->getSubject(),
            'read'        => $mail->isRead(),
            'deleted'     => false,
            'timestamp'   => $mail->getTimestamp()->format(\DateTime::RFC3339_EXTENDED),
            'project'     => $mail->getProject(),
            'content'     => $mail->getHtml() !== null ? $mail->getHtml() : $mail->getText(),
            'hasText'     => $mail->getText() !== null,
            'hasHtml'     => $mail->getHtml() !== null,
            'attachments' => $mail->getAttachments(),
        ];
    }
}
