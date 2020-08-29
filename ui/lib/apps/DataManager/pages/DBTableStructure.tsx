import * as xcClient from '@lib/utils/xcClient/database'

import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseSquareOutlined,
  DownOutlined,
  MinusSquareTwoTone,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import {
  Card,
  Head,
  Pre,
  AnimatedSkeleton,
  Descriptions,
} from '@lib/components'
import React, { useEffect, useState } from 'react'

import { parseColumnRelatedValues } from '@lib/utils/xcClient/util'
import { useNavigate } from 'react-router-dom'
import useQueryParams from '@lib/utils/useQueryParams'
import { useTranslation } from 'react-i18next'

const { Option } = Select

// route: /data/table_structure?db=xxx&table=yyy
export default function DBTableStructure() {
  const navigate = useNavigate()
  const { db, table } = useQueryParams()

  const { t } = useTranslation()

  const [form] = Form.useForm()

  const [tableInfo, setTableInfo] = useState<xcClient.GetTableInfoResult>()
  const [isLoading, setIsLoading] = useState(false)

  const [visible, setVisible] = useState(false)
  const [modalInfo, setModalInfo] = useState<any>({
    type: '',
    title: '',
  })

  const fetchTableInfo = async () => {
    setIsLoading(true)
    try {
      setTableInfo(await xcClient.getTableInfo(db, table))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTableInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showModal = (info) => () => {
    setModalInfo(info)
    setVisible(true)
  }

  const handleOk = async (values) => {
    let _values
    if (
      modalInfo.type === 'insertColumnAtHead' ||
      modalInfo.type === 'insertColumnAtTail' ||
      modalInfo.type === 'addColumnAfter'
    ) {
      _values = parseColumnRelatedValues(values)
    }

    switch (modalInfo.type) {
      case 'insertColumnAtHead':
        try {
          await xcClient.addTableColumnAtHead(db, table, _values)
          Modal.success({
            content: t('data_manager.create_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.create_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
          return
        }
        break
      case 'insertColumnAtTail':
        try {
          await xcClient.addTableColumnAtTail(db, table, _values)
          Modal.success({
            content: t('data_manager.create_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.create_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
          return
        }
        break
      case 'addColumnAfter':
        try {
          await xcClient.addTableColumnAfter(
            db,
            table,
            _values,
            modalInfo.columnName
          )
          Modal.success({
            content: t('data_manager.create_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.create_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
          return
        }
        break
      case 'addIndex':
        if (!values.columns || values.columns.length === 0) {
          Modal.error({
            content: `${t('data_manager.please_input')}${t(
              'data_manager.columns'
            )}`,
          })
          return
        }
        try {
          await xcClient.addTableIndex(db, table, values)
          Modal.success({
            content: t('data_manager.create_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.create_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
          return
        }
        break
    }

    handleCancel()
  }

  const handleCancel = () => {
    setVisible(false)
    form.resetFields()
  }

  const handleDeleteColumn = (name) => () => {
    Modal.confirm({
      icon: <ExclamationCircleOutlined />,
      content: `${t('data_manager.confirm_delete_txt')} ${name}`,
      onOk: async () => {
        try {
          await xcClient.dropTableColumn(db, table, name)
          Modal.success({
            content: t('data_manager.delete_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.delete_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
        }
      },
    })
  }

  const handleAddColumnAfter = (name) => () => {
    showModal({
      type: 'addColumnAfter',
      title: t('data_manager.insert_column'),
      columnName: name,
    })()
  }

  const handleDeleteIndex = (name) => () => {
    Modal.confirm({
      icon: <ExclamationCircleOutlined />,
      content: `${t('data_manager.confirm_delete_txt')} ${name}`,
      onOk: async () => {
        try {
          await xcClient.dropTableIndex(db, table, name)
          Modal.success({
            content: t('data_manager.delete_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.delete_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
        }
      },
    })
  }

  const handleDeletePartition = (name) => () => {
    Modal.confirm({
      icon: <ExclamationCircleOutlined />,
      content: `${t('data_manager.confirm_delete_txt')} ${name}`,
      onOk: async () => {
        try {
          await xcClient.dropPartition(db, table, name)
          Modal.success({
            content: t('data_manager.delete_success_txt'),
            onOk: () => {
              fetchTableInfo()
            },
          })
        } catch (e) {
          Modal.error({
            title: t('data_manager.delete_failed_txt'),
            content: <Pre>{e.message}</Pre>,
          })
        }
      },
    })
  }

  return (
    <>
      <Head
        title={table}
        back={
          <a onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> {db}
          </a>
        }
      />
      {tableInfo?.viewDefinition && (
        <Card title={t('data_manager.view_definition')}>
          <Pre>{tableInfo?.viewDefinition}</Pre>
        </Card>
      )}
      <Card
        title={t('data_manager.columns')}
        extra={
          tableInfo?.info.type === xcClient.TableType.TABLE && (
            <Space>
              <Button
                type="primary"
                onClick={showModal({
                  type: 'insertColumnAtHead',
                  title: t('data_manager.insert_column_at_head'),
                })}
              >
                {t('data_manager.insert_column_at_head')}
              </Button>
              <Button
                type="primary"
                onClick={showModal({
                  type: 'insertColumnAtTail',
                  title: t('data_manager.insert_column_at_tail'),
                })}
              >
                {t('data_manager.insert_column_at_tail')}
              </Button>
            </Space>
          )
        }
      >
        <AnimatedSkeleton showSkeleton={!tableInfo && isLoading}>
          {tableInfo && (
            <Table
              tableLayout="fixed"
              size="small"
              bordered
              pagination={false}
              dataSource={tableInfo.columns}
              rowKey="name"
              columns={[
                {
                  title: t('data_manager.name'),
                  dataIndex: 'name',
                  key: 'name',
                  ellipsis: true,
                },
                {
                  title: t('data_manager.field_type'),
                  dataIndex: 'fieldType',
                  key: 'fieldType',
                  ellipsis: true,
                },
                {
                  title: t('data_manager.not_null'),
                  dataIndex: 'isNotNull',
                  key: 'isNotNull',
                  width: 100,
                  render: (v) => {
                    if (v) {
                      return <CheckOutlined />
                    } else {
                      return ''
                    }
                  },
                },
                {
                  title: t('data_manager.default_value'),
                  dataIndex: 'defaultValue',
                  key: 'defaultValue',
                  width: 150,
                },
                {
                  title: t('data_manager.comment'),
                  dataIndex: 'comment',
                  key: 'comment',
                  width: 150,
                },
                {
                  title: t('data_manager.view_db.operation'),
                  key: 'operation',
                  width: 150,
                  render: (_: any, record: any) => {
                    return (
                      tableInfo?.info.type === xcClient.TableType.TABLE && (
                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item>
                                <a onClick={handleAddColumnAfter(record.name)}>
                                  {t('data_manager.db_structure.op_insert')}
                                </a>
                              </Menu.Item>
                              <Menu.Item>
                                <a onClick={handleDeleteColumn(record.name)}>
                                  <Typography.Text type="danger">
                                    {t('data_manager.db_structure.op_drop')}
                                  </Typography.Text>
                                </a>
                              </Menu.Item>
                            </Menu>
                          }
                        >
                          <a>
                            {t('data_manager.view_db.operation')}{' '}
                            <DownOutlined />
                          </a>
                        </Dropdown>
                      )
                    )
                  },
                },
              ]}
            />
          )}
        </AnimatedSkeleton>
      </Card>
      {tableInfo?.info.type !== xcClient.TableType.VIEW && (
        <Card
          title={t('data_manager.indexes')}
          extra={
            tableInfo?.info.type === xcClient.TableType.TABLE && (
              <Space>
                <Button
                  type="primary"
                  onClick={showModal({
                    type: 'addIndex',
                    title: t('data_manager.add_index'),
                  })}
                >
                  {t('data_manager.add_index')}
                </Button>
              </Space>
            )
          }
        >
          <AnimatedSkeleton showSkeleton={!tableInfo && isLoading}>
            {tableInfo && (
              <Table
                tableLayout="fixed"
                size="small"
                bordered
                pagination={false}
                dataSource={tableInfo.indexes.map((d, i) => ({
                  ...{ key: d.name + i },
                  ...d,
                  ...{ columns: d.columns.join(', ') },
                }))}
                columns={[
                  {
                    title: t('data_manager.name'),
                    dataIndex: 'name',
                    key: 'name',
                    ellipsis: true,
                  },
                  {
                    title: t('data_manager.columns'),
                    dataIndex: 'columns',
                    key: 'columns',
                    ellipsis: true,
                  },
                  {
                    title: 'Type',
                    dataIndex: 'type',
                    key: 'type',
                    width: 150,
                    render: (_: any, record: any) =>
                      xcClient.TableInfoIndexType[record.type],
                  },
                  {
                    title: t('data_manager.delete'),
                    key: 'isDeleteble',
                    width: 150,
                    render: (_: any, record: any) =>
                      record.isDeleteble && (
                        <a onClick={handleDeleteIndex(record.name)}>
                          <Typography.Text type="danger">
                            <CloseSquareOutlined />
                          </Typography.Text>
                        </a>
                      ),
                  },
                ]}
              />
            )}
          </AnimatedSkeleton>
        </Card>
      )}

      {tableInfo?.partition && (
        <Card title={t('data_manager.partition_table')}>
          <Descriptions column={1}>
            <Descriptions.Item label={t('data_manager.partition_type')}>
              {tableInfo.partition.type}
            </Descriptions.Item>
            <Descriptions.Item label={t('data_manager.partition_expr')}>
              <Pre>{tableInfo.partition.expr}</Pre>
            </Descriptions.Item>
            {tableInfo.partition.type === xcClient.PartitionType.RANGE && (
              <Descriptions.Item label={t('data_manager.partitions')}>
                <Table
                  tableLayout="fixed"
                  size="small"
                  bordered
                  pagination={false}
                  dataSource={tableInfo.partition.partitions}
                  columns={[
                    {
                      title: t('data_manager.name'),
                      dataIndex: 'name',
                      key: 'name',
                      ellipsis: true,
                    },
                    {
                      title: t('data_manager.partition_value'),
                      dataIndex: 'boundaryValue',
                      key: 'boundaryValue',
                      render: (_: any, record: any) =>
                        record.boundaryValue || 'MAXVALUE',
                      ellipsis: true,
                    },
                    {
                      title: t('data_manager.view_db.operation'),
                      key: 'operation',
                      width: 150,
                      render: (_: any, record: any) => {
                        return (
                          tableInfo?.info.type === xcClient.TableType.TABLE && (
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item>
                                    <a
                                      onClick={handleDeletePartition(
                                        record.name
                                      )}
                                    >
                                      <Typography.Text type="danger">
                                        {t('data_manager.delete_partition')}
                                      </Typography.Text>
                                    </a>
                                  </Menu.Item>
                                </Menu>
                              }
                            >
                              <a>
                                {t('data_manager.view_db.operation')}{' '}
                                <DownOutlined />
                              </a>
                            </Dropdown>
                          )
                        )
                      },
                    },
                  ]}
                />
              </Descriptions.Item>
            )}
            {tableInfo.partition.type === xcClient.PartitionType.HASH && (
              <Descriptions.Item label={t('data_manager.number_of_partitions')}>
                {tableInfo.partition.numberOfPartitions}
              </Descriptions.Item>
            )}
            {tableInfo.partition.type === xcClient.PartitionType.LIST && (
              <Descriptions.Item label={t('data_manager.partitions')}>
                <Table
                  tableLayout="fixed"
                  size="small"
                  bordered
                  pagination={false}
                  dataSource={tableInfo.partition.partitions}
                  columns={[
                    {
                      title: t('data_manager.name'),
                      dataIndex: 'name',
                      key: 'name',
                      ellipsis: true,
                    },
                    {
                      title: t('data_manager.partition_value'),
                      dataIndex: 'values',
                      key: 'values',
                      ellipsis: true,
                    },
                    {
                      title: t('data_manager.view_db.operation'),
                      key: 'operation',
                      width: 150,
                      render: (_: any, record: any) => {
                        return (
                          tableInfo?.info.type === xcClient.TableType.TABLE && (
                            <Dropdown
                              overlay={
                                <Menu>
                                  <Menu.Item>
                                    <a
                                      onClick={handleDeletePartition(
                                        record.name
                                      )}
                                    >
                                      <Typography.Text type="danger">
                                        {t('data_manager.delete_partition')}
                                      </Typography.Text>
                                    </a>
                                  </Menu.Item>
                                </Menu>
                              }
                            >
                              <a>
                                {t('data_manager.view_db.operation')}{' '}
                                <DownOutlined />
                              </a>
                            </Dropdown>
                          )
                        )
                      },
                    },
                  ]}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      <Modal
        visible={visible}
        title={modalInfo.title}
        width={700}
        onOk={form.submit}
        onCancel={handleCancel}
      >
        <Form form={form} onFinish={handleOk} layout="vertical">
          {(modalInfo.type === 'insertColumnAtHead' ||
            modalInfo.type === 'insertColumnAtTail' ||
            modalInfo.type === 'addColumnAfter') && (
            <>
              <Form.Item
                label={t('data_manager.name')}
                name="name"
                rules={[{ required: true }]}
              >
                <Input style={{ maxWidth: 300 }} />
              </Form.Item>
              <Form.Item label={t('data_manager.field_type')}>
                <Space>
                  <Form.Item
                    name="typeName"
                    rules={[
                      {
                        required: true,
                        message: `${t('data_manager.please_input')}${t(
                          'data_manager.field_type'
                        )}`,
                      },
                    ]}
                    noStyle
                  >
                    <Select
                      style={{ width: 150 }}
                      placeholder={t('data_manager.field_type')}
                    >
                      {Object.values(xcClient.FieldTypeName).map((t) => (
                        <Option key={t} value={t}>
                          {t}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="length" noStyle>
                    <Input
                      type="number"
                      placeholder={t('data_manager.length')}
                    />
                  </Form.Item>
                  <Form.Item name="decimals" noStyle>
                    <Input
                      type="number"
                      placeholder={t('data_manager.decimal')}
                    />
                  </Form.Item>
                </Space>
              </Form.Item>
              <Form.Item>
                <Space>
                  <Form.Item name="isNotNull" valuePropName="checked" noStyle>
                    <Checkbox>{t('data_manager.not_null')}?</Checkbox>
                  </Form.Item>
                  <Form.Item name="isUnsigned" valuePropName="checked" noStyle>
                    <Checkbox>{t('data_manager.unsigned')}?</Checkbox>
                  </Form.Item>
                </Space>
              </Form.Item>
              <Form.Item
                label={t('data_manager.default_value')}
                name="defaultValue"
              >
                <Input style={{ maxWidth: 300 }} />
              </Form.Item>
              <Form.Item label={t('data_manager.comment')} name="comment">
                <Input style={{ maxWidth: 300 }} />
              </Form.Item>
            </>
          )}
          {modalInfo.type === 'addIndex' && (
            <>
              <Form.Item
                label={t('data_manager.name')}
                name="name"
                rules={[{ required: true }]}
              >
                <Input style={{ maxWidth: 300 }} />
              </Form.Item>
              <Form.Item
                name="type"
                label={t('data_manager.type')}
                rules={[{ required: true }]}
              >
                <Select style={{ maxWidth: 300 }}>
                  {Object.entries(xcClient.TableInfoIndexType)
                    .filter((t) => typeof t[1] === 'number')
                    .filter((t) => t[0] !== 'Primary')
                    .map((t) => (
                      <Option key={t[0]} value={t[1]}>
                        {t[0]}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.List name="columns">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((f, i) => (
                      <Form.Item
                        key={f.key}
                        label={`${t('data_manager.columns')} #${i + 1}`}
                      >
                        <Space>
                          <Form.Item
                            name={[f.name, 'columnName']}
                            fieldKey={[f.fieldKey, 'columnName'] as any}
                            rules={[
                              {
                                required: true,
                                message: `${t('data_manager.please_input')}${t(
                                  'data_manager.name'
                                )}`,
                              },
                            ]}
                            noStyle
                          >
                            <Select style={{ width: 100 }}>
                              {tableInfo &&
                                (form.getFieldValue('columns')
                                  ? tableInfo.columns.filter(
                                      (c) =>
                                        !form
                                          .getFieldValue('columns')
                                          .filter((d) => d !== undefined)
                                          .map((c) => c.columnName)
                                          .includes(c.name)
                                    )
                                  : tableInfo.columns
                                )
                                  .map((c) => c.name)
                                  .map((d, i) => (
                                    <Option key={d + i} value={d}>
                                      {d}
                                    </Option>
                                  ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name={[f.name, 'keyLength']}
                            fieldKey={[f.fieldKey, 'keyLength'] as any}
                            noStyle
                          >
                            <Input
                              type="number"
                              placeholder={t('data_manager.length')}
                            />
                          </Form.Item>
                          <MinusSquareTwoTone
                            twoToneColor="#ff4d4f"
                            onClick={() => remove(f.name)}
                          />
                        </Space>
                      </Form.Item>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => {
                          console.log(form.getFieldValue('columns'))
                          add()
                        }}
                      >
                        <PlusOutlined /> {t('data_manager.add_column')}
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </>
          )}
        </Form>
      </Modal>
    </>
  )
}
