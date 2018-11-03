"use strict";

const _         = require('lodash');

module.exports = function(sequelize, DataTypes) {
    var Terminal = sequelize.define("terminal", {
        id: {type: DataTypes.INTEGER, autoIncrement: true, unique: true, allowNull: false},
        sim_no: {type: DataTypes.STRING(20), primaryKey: true, unique: true, allowNull: false},
        plate_no: {type: DataTypes.STRING(20), unique: true, allowNull: false},
        term_no: DataTypes.STRING(20),
        manufacturerCode: DataTypes.STRING(10),
        model: DataTypes.STRING(10),
        plate_color: DataTypes.INTEGER,
        regionCode: DataTypes.STRING(6),
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },

        dep_id: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
        owner: DataTypes.STRING(20),
        register_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        registered: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        
        driver: DataTypes.STRING(20),
        type: DataTypes.INTEGER,
        industry: DataTypes.INTEGER,
        load: DataTypes.INTEGER,
        run_line: DataTypes.STRING(255),
        init_time: { type: DataTypes.INTEGER, defaultValue: 0},
        init_mileage: DataTypes.INTEGER,
        mileage_correct: DataTypes.FLOAT,
        oyster_sauce: DataTypes.INTEGER,
        remark: DataTypes.STRING(255),
        remark2: DataTypes.STRING(255),
        checkcode: { type: DataTypes.STRING(6), defaultValue: '123456', allowNull: false }
    }, {
        tableName: 'iov_terms',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Terminal.associate = function(models) {

        Terminal.belongsTo(models.group, {
            foreignKey: 'group_id'
        });

        Terminal.hasOne(models.realtime, {
            foreignKey: 'sim_no'
        });

        Terminal.hasMany(models.param, {
            foreignKey: 'sim_no'
        });

        Terminal.hasMany(models.term_region, {
            foreignKey: 'sim_no'
        });

        Terminal.hasMany(models.media, {
            foreignKey: 'sim_no'
        });

        Terminal.belongsToMany(models.user, {
            through: 'iov_users_to_terms',
            foreignKey: 'sim_no'
        });
        Terminal.hasMany(models.termsdriver, {
            foreignKey: 'sim_no'
        });
    }

    
    Terminal.prototype.toJsonFull = function() {
        let getOrgGroup=function(ids){
            if(!ids) return '';
            let g = ids.substr(0,ids.length-1)
            let pos = g.lastIndexOf('.');
            return pos==-1 ? '' : g.substr(pos+1);
        }
        return {
            simno: this.sim_no,
            online: this.realtime? this.realtime.online: false,
            lng: this.realtime? +this.realtime.longitude: 0.0, 
            lat: this.realtime? +this.realtime.latitude: 0.0,
            gspeed: this.realtime? this.realtime.speed: 0,
            altitude: this.realtime? this.realtime.altitude: 0, 
            status: this.realtime? this.realtime.status: 0, 
            alarms: this.realtime? this.realtime.alarm_status: 0, 
            time: this.realtime? this.realtime.gps_date: null, 
            mileage: this.realtime? this.realtime.mileage: 0, 
            tt: this.realtime? this.realtime.temperature: 0.0,
            oil: this.realtime? this.realtime.fuel: 0, 
            bspeed: this.realtime? this.realtime.board_speed: 0, 
            group: this.dep_id,
            pgroup: this.group_id,
            mcode: this.manufacturerCode,
            model: this.model, 
            platecolor: this.plate_color, 
            plateno: this.plate_no,
            cname: this.region ? this.region.map(t=> t.code_name).join(','): '',
            orgname: this.group ? this.group.name: '',
            orggroup: this.group ? getOrgGroup(this.group.parents): '',
            orggroup1: this.group ? this.group.parents : '',
            postcode: this.regionCode,
            enable: !this.deleted,
            
            tno: this.term_no,
            rdate: this.register_date,
            reg: this.registered,
            driver: this.driver,
            type: this.type,
            industry: this.industry,
            load: this.load,
            line: this.run_line,
            itime: this.init_time,
            imileage: this.init_mileage,
            cmileage: this.mileage_correct,
            oyster: this.oyster_sauce,
            remark: this.remark,
            remark2: this.remark2
        }
    }

    Terminal.prototype.toJsonSimple = function() {
        return {
            id: this.id,
            simno: this.sim_no,
            mcode: this.manufacturerCode,
            model: this.model, 
            platecolor: this.plate_color, 
            plateno: this.plate_no
        }
    }
    
    Terminal.addTerminal = function(values, t) {

        let tmpsimno;
        if (values.sim_no) {
            tmpsimno = Promise.resolve(values.sim_no);
        } else {
            tmpsimno = Terminal.findOne({
                attributes: ['sim_no'],
                where: {sim_no: {[Op.like]: 'SIM%'}},
                order: [['sim_no', 'desc']],
                transaction: t
            }).then((r)=> {
                const sn = r ? + r.sim_no.substr(3) + 1 : 1;
                const simno = 'SIM' + _.padStart(sn, 8, '0');
                return simno;
            });
        }

        return tmpsimno.then(simno=> {
            values.sim_no = simno;
            return Terminal.create(values, {
                transaction: t
            });
        });
        
    }

    return Terminal;
}

