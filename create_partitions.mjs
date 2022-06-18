import pg from 'pg';
/*
This script creates 100 partitions 
and attaches them to the main table customers
docker run --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
*/
(async function () {
    try {
        const postgresClient = new pg.Client({
            "user": "postgres",
            "password": "postgres",
            "host": "raghul",
            "port": 5432,
            "database": "postgres"
        })
        console.log("connecting to postgres...")
        await postgresClient.connect();
        console.log("creating database customers...")
        await postgresClient.query("create database customers")


        const customersDbClient = new pg.Client({
            "user": "postgres",
            "password": "postgres",
            "host": "husseinmac",
            "port": 5432,
            "database": "customers"
        })

        console.log("connecting to customers db...")
        await customersDbClient.connect();
        console.log("creating customers table...")
        const sql = `create table customers (id serial, name text) 
                 partition by range (id)`
        await customersDbClient.query(sql)
        console.log("creating partitions... ")


        /*
        assume we are going to support 1B customers
        and each partition will have 10M customers 
        that gives 1000/10 -> 100 partition tables 
        */
        for (let i = 0; i < 100; i++) {
            const idFrom = i * 10000000;
            const idTo = (i + 1) * 10000000;
            const partitionName = `customers_${idFrom}_${idTo}`
            const query1 = `create table ${partitionName}
                         (like customers including indexes)`;

            const query2 = `alter table customers
            attach partition ${partitionName}
            for values from (${idFrom}) to (${idTo})
         `;

            console.log(`creating partition ${partitionName} `)
            await customersDbClient.query(query1);
            await customersDbClient.query(query2);
        }


        console.log("closing connection")
        await customersDbClient.end();
        await postgresClient.end();
        console.log("All set!")
    }
    catch (error) {
        console.error(`Error: ${JSON.stringify(error)}`)
    }
})();




