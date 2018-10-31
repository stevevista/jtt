

function createOrUpdate(Table, prop, keys) {

    const condition = {};
    keys.forEach(k=> {
        condition[k] = prop[k];
    });

    return Table.findOne({
        where: condition  
    }).then(r=> {
        if (r == null) {
            return Table.create(prop);
        } else {
            return r.update(prop).then(()=> r);
        }
    })
}


exports.createOrUpdate = createOrUpdate;
