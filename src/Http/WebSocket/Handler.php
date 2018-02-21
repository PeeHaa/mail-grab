<?php declare(strict_types=1);

namespace PeeHaa\MailGrab\Http\WebSocket;

use Aerys\Request;
use Aerys\Response;
use Aerys\Websocket;
use Aerys\Websocket\Endpoint;
use function Amp\asyncCall;
use PeeHaa\MailGrab\Http\Response\Initialized;
use PeeHaa\MailGrab\Http\Response\NewMail;
use PeeHaa\MailGrab\Smtp\Command\Factory;
use PeeHaa\MailGrab\Smtp\Log\Level;
use PeeHaa\MailGrab\Smtp\Log\Output;
use PeeHaa\MailGrab\Smtp\Message;
use PeeHaa\MailGrab\Smtp\Server;

class Handler implements Websocket
{
    /** @var Endpoint */
    private $endpoint;

    private $origin;

    public function __construct(string $origin)
    {
        $this->origin = $origin;
    }

    public function onStart(Endpoint $endpoint)
    {
        $this->endpoint = $endpoint;

        asyncCall(function() {
            (new Server(new Factory(), [$this, 'pushMessage'], new Output(new Level(Level::INFO))))->run();
        });
    }

    public function onHandshake(Request $request, Response $response)
    {
        if ($request->getHeader('origin') !== $this->origin) {
            $response->setStatus(403);
            $response->end('<h1>origin not allowed</h1>');

            return null;
        }

        return $request->getConnectionInfo()['client_addr'];
    }

    public function onOpen(int $clientId, $handshakeData)
    {
        $this->endpoint->send((string) new Initialized(), $clientId);
    }

    public function pushMessage(Message $message)
    {
        $mail = new NewMail($message);

        $this->endpoint->broadcast((string) $mail);
    }

    public function onData(int $clientId, Websocket\Message $msg)
    {
        // yielding $msg buffers the complete payload into a single string.
    }

    public function onClose(int $clientId, int $code, string $reason)
    {

    }

    public function onStop()
    {
        // intentionally left blank
    }
}