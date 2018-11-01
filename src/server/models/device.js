"use strict"

module.exports = function(sequelize, DataTypes) {
  var Table = sequelize.define('iov_device', {
    simNo: {type: DataTypes.STRING(12), primaryKey: true}
  }, {
    tableName: 'iov_device'
  })

  Table.associate = function(models) {
    Table.belongsTo(models.iov_vehicle, {
      foreignKey: 'vehicleId'
    })
    Table.hasOne(models.iov_device_status, {
      foreignKey: 'simNo'
    })
    Table.hasMany(models.iov_term_params, {
      foreignKey: 'simNo'
    })

    Table.hasMany(models.iov_term_region, {
        foreignKey: 'simNo'
    })

    Table.hasMany(models.iov_media, {
        foreignKey: 'simNo'
    })

    Table.belongsToMany(models.iov_user, {
        through: 'iov_users_to_terms',
        foreignKey: 'simNo'
    })
  }

  Table.prototype.toJsonFull = function() {
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
        plateNo: this.plateNo,
        cname: this.region ? this.region.map(t=> t.code_name).join(','): '',
        orgname: this.group ? this.group.name: '',
        orggroup: this.group ? getOrgGroup(this.group.parents): '',
        orggroup1: this.group ? this.group.parents : '',
        postcode: this.regionCode,
        enable: !this.deleted,
        
        tno: this.termNo,
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

Table.prototype.toJsonSimple = function() {
    return {
        id: this.id,
        simno: this.sim_no,
        mcode: this.manufacturerCode,
        model: this.model, 
        platecolor: this.plate_color, 
        plateno: this.plateNo
    }
}

Table.addTerminal = function(values, t) {

    let tmpsimno;
    if (values.sim_no) {
        tmpsimno = Promise.resolve(values.sim_no);
    } else {
        tmpsimno = Table.findOne({
            attributes: ['sim_no'],
            where: {sim_no: {$like: 'SIM%'}},
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
        return Table.create(values, {
            transaction: t
        });
    });
    
}

  return Table
}
