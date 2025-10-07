import fp from 'fastify-plugin';

import { als } from './als';
import { ALT_HEADER, generateTxId, TX_HEADER } from './txid.utils';

export default fp(async function txidPlugin(fastify) {
  fastify.addHook('onRequest', (req, reply, done) => {
    const txHeader = req.headers[TX_HEADER] as string;
    const altHeader = req.headers[ALT_HEADER] as string;

    let incoming: string | null = null;
    if (txHeader && txHeader !== 'null' && txHeader.trim() !== '') {
      incoming = txHeader;
    } else if (altHeader && altHeader !== 'null' && altHeader.trim() !== '') {
      incoming = altHeader;
    }

    const txId = incoming || generateTxId();
    reply.header(TX_HEADER, txId);

    als.run({ txId }, done);
  });
});
