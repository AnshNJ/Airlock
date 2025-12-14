import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';
import logger from '../utils/logger.js';

if(!process.env.DATABASE_URL){
    throw new Error('DATABASE_URL is not set');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000, //Wait for 30 seconds before throwing an error
        idle: 10000 //Wait for 10 seconds before closing the connection
    }
});

//Schema for the audit log
export const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue:  DataTypes.UUIDV4,
        primaryKey: true
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    instruction: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    script: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fileHash: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'AuditLog', // Explicitly set table name to prevent pluralization
    timestamps: true // Enable createdAt and updatedAt
});


export const initDB = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true }); //Alter the database schema to match the model
        logger.info('Connection has been established successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}   