
const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health');
const accountReassignmentRoute = require('./routes/account_reassignment');
const freshsuccessRoute = require('./routes/freshsuccess');
const customerMappingRoute = require('./routes/customer_mapping');
const testRoutes = require('./routes/test');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/health', healthRoute);
app.use('/account_reassignment', accountReassignmentRoute);
app.use('/freshsuccess', freshsuccessRoute);
app.use('/customer_mapping', customerMappingRoute);
app.use('/api/test', testRoutes);


app.listen(PORT, () => 
{
    console.log(`API running on http://localhost:${PORT}`);
});