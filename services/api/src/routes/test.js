const express = require('express');
const router = express.Router();
const common = require("@fyle-ops/common");
const { fs_account } = require("@fyle-ops/freshsuccess");

async function getAccountName(accountId)
{
  // Create FS Account instance
  const account = new fs_account();
  await account.getAccounts();

  const idx = account.locateOrg(accountId);
  let account_name = "";

  if(idx === -1)
  {
      console.log(`Account with ID ${accountId} not found.`);
      account_name = "Unknown Account";
  }
  else
  {
      account_name = account.account_list[idx]["id"]["account_name"];
  }
  return account_name;
}

router.post('/ping', async(req, res) => {
  const { name, source, accountId } = req.body;

  const updatedName = name ? name.toUpperCase() : '';
  let message = `Hello ${updatedName}. Request received from ${source}.`;
  const result = {
    originalName: name,
    updatedName,
    source,
    accountId,
    processedAt: new Date().toISOString()
  };

  const account_name = await getAccountName(accountId);

  message += ` Account Name: ${account_name}`;

  res.json({
    ok: true,
    message,
    result
  });
});

module.exports = router;
