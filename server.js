const e = require('express');
const express = require('express'),
      bodyParser = require('body-parser'),
      connection = require('express-myconnection'),
      cors = require('cors'),
      mysql = require('mysql2'),
      async = require('async'),
      multer = require('multer');

const app = express();

app.use(bodyParser.json())

app.use(cors());

const upload = multer({storage: multer.memoryStorage()})

const db = mysql.createConnection({
  host: '31.31.198.99',
  user: 'u1699228_admin',
  password : 'rQiWkLLhd56X5dN8',
  database:'u1699228_curator_db'
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/login', (req, res) => {
  const login = req.body.login,
        password = req.body.password;

  db.query('SELECT * FROM curators WHERE login = (?) AND password = (?)', [login, password], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.post('/groups', (req, res) => {
  const group = req.body.group,
        curator = req.body.curator;

  db.query('INSERT INTO student_groups(group_name, curator_id) VALUES(?, ?) ', [group, curator], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.post('/add-curator', (req, res) => {
  const first_name = req.body.first_name,
        second_name = req.body.second_name,
        last_name = req.body.last_name,
        phone = req.body.phone,
        email = req.body.email,
        login = req.body.login,
        password = req.body.password;

  db.query('INSERT INTO curators(first_name, second_name, last_name, email, phone, login, password) VALUES(?, ?, ?, ?, ?, ?, ?) ', [first_name, second_name, last_name, email, phone, login, password], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.post('/add-student', (req, res) => {
  const {first_name, 
    second_name,
    last_name, 
    birth_date, 
    address, 
    phone, 
    email, 
    is_leader,
    is_in_dorm, 
    group_id, 
    additional_info} = req.body.student;

  db.query('INSERT INTO students(first_name, second_name, last_name, birth_date, address, email, phone, is_in_dorm, is_leader, additional_info, group_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ', [first_name, second_name, last_name, birth_date, address, email, phone, is_in_dorm, is_leader, additional_info, group_id], (err) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      db.query('SELECT LAST_INSERT_ID()', (err, student_id) => {
        if(err) {
          res.send({type: 'error', message: err.message});
        } else {
          const parentsRecords = req.body.student_parents.filter(parent => parent !== null)
          .map(parentRecord => {
            return [
                    parentRecord.first_name,
                    parentRecord.second_name,
                    parentRecord.last_name,
                    parentRecord.email,
                    parentRecord.phone,
                    parentRecord.role,
                    student_id[0]['LAST_INSERT_ID()']
                   ]
          });
          if(parentsRecords.length > 0) {
            db.query("INSERT INTO parents(first_name, second_name, last_name, email, phone, role, student_id) VALUES ?", [parentsRecords], (err) => {
              if(err) {
                res.send({type: 'error', message: err.message});
              } else {
                res.send({type: 'success'});
              }
            });
          } else {
            res.send({type: 'success'});
          }
        }
      })
    }
  });
})

app.post('/add-group', upload.single('thumbnail'), (req, res) => {
  const group_name = req.body.group_name;

  db.query('INSERT INTO student_groups(group_name) VALUES(?) ', [group_name], (err) => {
    if (err) {
      res.send({type:'error', message: err.message})
    } else {
      res.send({type:'success'});
    }
  });
})

app.post('/add-event', upload.single('thumbnail'), (req, res) => {
  const event_name = req.body.event_name,
        description = req.body.description,
        thumbnail = req.file.buffer.toString('base64'),
        start_date = req.body.start_date,
        end_date = req.body.end_date;

  db.query('INSERT INTO events(event_name, description, thumbnail, start_date, end_date) VALUES(?, ?, ?, ?, ?) ', [event_name, description, thumbnail, start_date, end_date], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success'});
    }
  });
})

app.post('/add-parent', (req, res) => {
  const {first_name, 
    second_name,
    last_name,
    phone, 
    email,
    role,
    student_id
  } = req.body.parent;

  db.query('INSERT INTO parents(first_name, second_name, last_name, phone, email, role, student_id) VALUES(?, ?, ?, ?, ?, ?, ?) ', [first_name, second_name, last_name, phone, email, role, student_id], (err) => {
    if (err) {
      res.send({type:"error", message: err.message})
    } else {
      res.send({type:"success"});
    }
  });
})

app.post('/add-participant', (req, res) => {
  const event_id = req.body.event_id,
        student_id = req.body.student_id,
        role = req.body.role;

  db.query('INSERT INTO event_attendance(event_id, student_id, role) VALUES(?, ?, ?) ', [event_id, student_id, role], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: "success"});
    }
  });
})

app.get('/all', (req, res) => {
  const allInfo = {}
  async.parallel([
    (parallel_done) => {
      db.query('SELECT * FROM curators', (err, result) => {
        if(err) {
          return parallel_done(err);
        } else {
          allInfo.curators = result;
          parallel_done();
        }
      })
    },
    (parallel_done) => {
      db.query('SELECT * FROM students', (err, result) => {
        if(err) {
          return parallel_done(err);
        } else {
          allInfo.students = result;
          parallel_done();
        }
      })
    },
    (parallel_done) => {
      db.query('SELECT * from events', (err, result) => {
        if(err) {
          return parallel_done(err);
        } else {
          allInfo.events = result;
          parallel_done();
        }
      })
    }
  ], (err) => {
    if(err) {
      res.send({type:"error", message: err.message})
    } else {
      res.send({type:"success", result: allInfo});
    }
  })
});

app.get('/all-curator-info', (req, res) => {
  const curator_id = req.query.curator_id;
  const allCuratorInfo = {};

  db.query('SELECT * FROM student_groups WHERE curator_id = ?', [curator_id], (err, groups) => {
    if(err) {
      res.send({type: 'error', message: err.message});
    } else {
      allCuratorInfo.groups = groups;
      const group_ids = groups.map(item => item.group_id);
      db.query('SELECT * FROM students WHERE group_id IN (?)', [group_ids], (err, students) => {
        if (err) {
          res.send({type: 'error', message: err.message});
        } else {
          allCuratorInfo.students = students;
          student_ids = students.map(student => student.student_id);
          const today = new Date();
          const priorDate = new Date(new Date().setDate(today.getDate() - 7));;
          const todayStr = `${today.getFullYear()}-${today.getMonth() < 10 ? 0 : ''}${today.getMonth()}-${today.getDate() < 10 ? 0 : ''}${today.getDate()}`;
          const priorDateStr = `${priorDate.getFullYear()}-${priorDate.getMonth() < 10 ? 0 : ''}${priorDate.getMonth()}-${priorDate.getDate() < 10 ? 0 : ''}${priorDate.getDate()}`;

          db.query('SELECT mark FROM student_stat WHERE student_id IN (?) AND date >= ? AND date <= ?', [student_ids, priorDateStr, todayStr], (err, stats) => {
            if (err) {
              res.send({type: 'error', message: err.message});
            } else {
              allCuratorInfo.stats = stats; 
              res.send({type:"success", result: allCuratorInfo});
            }
          });
        }
      });
    }
  })
});

app.get('/all-curators', (req, res) => {
  db.query('SELECT * FROM curators where curator_id > 1', [], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.get('/all-events', (req, res) => {
  db.query('SELECT * FROM events', [], (err, result) => {
    if (err) {
      res.send({type:"error", message: err.message})
    } else {
      res.send({type:"success", result});
    }
  });
})

app.get('/all-students', (req, res) => {
  db.query('SELECT * FROM students', [], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.get('/all-parents', (req, res) => {
  db.query('SELECT * FROM parents', [], (err, result) => {
    if (err) {
      res.send({type:"error", message: err.message});
    } else {
      res.send({type:"success", result});
    }
  });
})

app.get('/all-groups', (req, res) => {
  db.query('SELECT * FROM student_groups', [], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.get('/curator-students', (req, res) => {
  const curator_id = req.query.id;
  db.query('SELECT group_id, group_name FROM student_groups WHERE curator_id = ?', [curator_id], (err, groups) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      const group_ids = groups.map(item => item.group_id);
      db.query('SELECT * FROM students WHERE group_id IN (?)', [group_ids], (err, result) => {
        if (err) {
          res.send({type: 'error', message: err.message});
        } else {
          res.send({type: 'success', result:{groups, items: result}});
        }
      });
    }
  });
})

app.get('/curator-students-management', (req, res) => {
  const curator_id = req.query.id;
  const dateLimit = new Date(new Date().setDate(new Date().getDate() - 7));
  const dateStr = `${dateLimit.getFullYear()}-${dateLimit.getMonth() < 10 ? 0 : ''}${dateLimit.getMonth()}-${dateLimit.getDate() < 10 ? 0 : ''}${dateLimit.getDate()}`;

  db.query('SELECT group_id, group_name FROM student_groups WHERE curator_id = ?', [curator_id], (err, groups) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      const group_ids = groups.map(item => item.group_id);
      db.query('SELECT * FROM students WHERE group_id IN (?)', [group_ids], (err, students) => {
        if (err) {
          res.send({type: 'error', message: err.message});
        } else {
          student_ids = students.map(student => student.student_id);
          db.query('SELECT * FROM student_stat WHERE student_id IN (?) AND date > ?', [student_ids, dateStr], (err, result) => {
            if (err) {
              res.send({type: 'error', message: err.message});
            } else {
              res.send({type: 'success', result:{groups, students, stats: result}});
            }
          });
        }
      });
    }
  });
})

app.get('/student-stat', (req, res) => {
  const student_id = req.query.student_id,
        start_date = req.query.start_date,
        end_date = req.query.end_date;
  db.query('SELECT * FROM students WHERE student_id = ?', [student_id], (err, student) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      db.query('SELECT subject_id, subject_name FROM teaching JOIN subjects using(subject_id) WHERE group_id = ?', [student[0].group_id], (err, subjects) => {
        if (err) {
          res.send({type: 'error', message: err.message});
        } else {
          db.query('SELECT student_id, subject_id, mark, attendance, date FROM student_stat WHERE student_id = ? AND date >= ? AND date <= ?', [student[0].student_id, start_date, end_date], (err, stats) => {
            if (err) {
              res.send({type: 'error', message: err.message});
            } else {
              res.send({type: 'success', result:{student_info: student[0], subjects, stats}});
            }
          });
        }
      });
    }
  });
})

app.get('/curator-event', (req, res) => {
  const event_id = +req.query.event_id;
  const curator_id = +req.query.curator_id;
  const eventInfo = {}
  async.parallel([
    (parallel_done) => {
      db.query('SELECT * FROM events WHERE event_id = ?', [event_id], (err, result) => {
        if(err) {
          return parallel_done(err);
        } else {
          eventInfo.details = result;
          parallel_done();
        }
      })
    },
    (parallel_done) => {
      db.query('SELECT students.student_id, event_attendance.event_id, first_name, last_name, students.group_id, group_name, role, curator_id FROM event_attendance RIGHT JOIN students ON event_attendance.student_id = students.student_id RIGHT JOIN student_groups ON students.group_id = student_groups.group_id WHERE student_groups.curator_id = ?', [curator_id], (err, result) => {
        if(err) {
          return parallel_done(err);
        } else {
          eventInfo.attendance = result;
          parallel_done();
        }
      })
    }
  ], (err) => {
    if(err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result: eventInfo});
    }
  })
});

app.post('/update-group', (req, res) => {
  const group_id = +req.body.group_id,
        curator_id = +req.body.curator_id;

  db.query('UPDATE student_groups SET curator_id = ? WHERE group_id = ?', [curator_id, group_id], (err) => {
    if (err) {
      res.send({type:'error', message: err.message})
    } else {
      res.send({type:'success'});
    }
  });
})

app.post('/update', (req, res) => {
  const table_name = req.body.table_name,
        table_col = req.body.table_col,
        table_val = req.body.table_val,
        table_check_col = req.body.table_check_col,
        table_check_val = req.body.table_check_val;

  db.query('UPDATE ?? SET ?? = ? WHERE ?? = ?', [table_name, table_col, table_val, table_check_col, table_check_val], (err) => {
    if (err) {
      res.send({type: 'error', message: err.message})
    } else {
      res.send({type: 'success'});
    }
  });
})

app.post('/delete-group-curator', (req, res) => {
  const group_id = req.body.group_id;
  
  db.query('UPDATE student_groups SET curator_id = null WHERE group_id = ?', [group_id], (err) => {
    if (err) {
      res.send({type: 'error', message: err.message})
    } else {
      res.send({type: 'success'});
    }
  });
})

app.post('/delete', (req, res) => {
  const table_name = req.body.table_name,
        column_name = req.body.column_name,
        column_value = req.body.column_value;
  
  db.query('DELETE FROM ?? WHERE ?? = ?', [table_name, column_name, column_value], (err, result) => {
    if (err) {
      res.send({type: 'error', message: err.message});
    } else {
      res.send({type: 'success', result});
    }
  });
})

app.listen(process.env.PORT || 3001, () => {
  console.log('server was successfully launched');
});