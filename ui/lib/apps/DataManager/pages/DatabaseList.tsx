import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as Database from '@lib/utils/xcClient/database'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Dropdown,
  Menu,
} from 'antd'
import { Card, Pre, Head } from '@lib/components'
import { useTranslation } from 'react-i18next'
import { DatabaseOutlined, DownOutlined } from '@ant-design/icons'

// route: /data
export default function DatabaseList() {
  const [dbList, setDbList] = useState<Object[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleteDBName, setDeleteDBName] = useState('')
  const { t } = useTranslation()

  async function fetchDatabaseList() {
    const result = (await Database.getDatabases()).databases
    setDbList(result)
  }

  useEffect(() => {
    fetchDatabaseList()
  }, [])

  const handleDelete = (dbName) => {
    setDeleteDBName(dbName)
    setDeleteModalVisible(true)
  }

  const DeleteDBModal = () => {
    async function deleteDatabase(deleteDBName) {
      try {
        await Database.dropDatabase(deleteDBName)
        fetchDatabaseList()
        Modal.success({ title: t('data_manager.delete_success_txt') })
      } catch (error) {
        Modal.error({
          title: t('data_manager.delete_failed_txt'),
          content: <Pre>{error.message}</Pre>,
        })
      }

      setDeleteModalVisible(false)
    }

    function handleOK() {
      deleteDatabase(deleteDBName)
      setDeleteModalVisible(true)
    }

    function handleCancel() {
      setDeleteModalVisible(false)
    }

    return (
      <Modal
        title={t('data_manager.delete_db_title')}
        visible={deleteModalVisible}
        onOk={handleOK}
        onCancel={handleCancel}
        cancelText={t('data_manager.cancel')}
        okText={t('data_manager.delete')}
      >
        <p>
          {t('data_manager.confirm_delete_txt')}{' '}
          <span style={{ fontWeight: 'bold' }}>{deleteDBName}</span>
        </p>
      </Modal>
    )
  }

  const CreateDBModal = () => {
    const onFinish = (values) => {
      async function handleCreateDB() {
        try {
          await Database.createDatabase(values.database_name)
          fetchDatabaseList()
          Modal.success({ title: t('data_manager.create_success_txt') })
        } catch (error) {
          Modal.error({
            title: t('data_manager.create_failed_txt'),
            content: <Pre>{error.message}</Pre>,
          })
        }

        setCreateModalVisible(false)
      }

      handleCreateDB()
    }

    const onCancel = () => {
      setCreateModalVisible(false)
    }

    return (
      <Modal
        title={t('data_manager.create_db')}
        visible={createModalVisible}
        onCancel={onCancel}
        cancelText={t('data_manager.cancel')}
        okText={t('data_manager.submit')}
        footer={null}
      >
        <Form onFinish={onFinish}>
          <Form.Item
            label={t('data_manager.db_name_input')}
            name="database_name"
            rules={[{ required: true, message: 'Please input database name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label=" " colon={false}>
            <Button type="primary" htmlType="submit">
              {t('data_manager.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    )
  }

  const columns = [
    {
      title: t('data_manager.db_name_column'),
      key: 'name',
      dataIndex: 'database_name',
      minWidth: 100,
      render: (database) => (
        <Link to={`/data/tables?db=${database}`}> {database} </Link>
      ),
    },
    {
      title: t('data_manager.action'),
      key: 'action',
      render: (database) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item>
                <a href={`#/data/export?db=${database.database_name}`}>
                  {t('data_manager.export_database')}
                </a>
              </Menu.Item>
              {/* <Menu.Item>
                <a href={`#/data/dump?db=${database.database_name}`}>
                  {t('data_manager.dump_database')}
                </a>
              </Menu.Item> */}
              <Menu.Divider />
              <Menu.Item>
                <a onClick={() => handleDelete(database.database_name)}>
                  <Typography.Text type="danger">
                    {t('data_manager.delete')}
                  </Typography.Text>
                </a>
              </Menu.Item>
            </Menu>
          }
        >
          <a>
            {t('data_manager.action')} <DownOutlined />
          </a>
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <Head
        title={t('data_manager.all_databases')}
        titleExtra={
          <Button onClick={() => setCreateModalVisible(true)}>
            <DatabaseOutlined /> {t('data_manager.create_db')}
          </Button>
        }
      />
      <Card>
        <DeleteDBModal />
        <CreateDBModal />
        <Table
          dataSource={dbList.map((db, i) => ({
            ...{ key: i },
            ...{ database_name: db },
          }))}
          columns={columns}
        />
      </Card>
    </>
  )
}
