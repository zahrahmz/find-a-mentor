import React, { useState, useContext } from 'react';
import styled from 'styled-components';

import { report } from '../../ga';
import { deleteMentor } from '../../api';
import auth from '../../utils/auth';
import messages from '../../messages';
import UserContext from '../../context/userContext/UserContext';
import { Modal } from './Modal';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import Checkbox from '../components/Checkbox';
import { desktop } from '../styles/shared/devices';
import model from './model';
import { fromMtoVM, fromVMtoM } from '../../helpers/user';
import Button from '../components/Button';
import { toast } from 'react-toastify';

const EditDetails = styled.div`
  margin: 0 auto;
  padding: 20px;
  width: 100%;
  max-width: 780px;
`;

const EditDetailsForm = styled.form`
  display: flex;
  width: 100%;
`;

const FormFields = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: stretch;
  padding: 0 5px;
  width: 100%;
`;

const ExtendedFormField = styled(FormField)`
  flex: 1 1 100%;
  max-width: 355px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  & label {
    color: #4f4f4f;
  }

  @media ${desktop} {
    flex: ${props => (props.customFormField ? '1 1 100%' : '1 1 40%')};
    max-width: ${props => (props.customFormField ? 'unset' : '355px')};
  }
`;

const InnerFieldsContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: stretch;
`;

const SubFieldContainer = styled.div``;

const HelpText = styled.div`
  display: block;
  margin: 5px 0 30px 0;
  font-weight: normal;
  font-size: inherit;
  line-height: inherit;
`;

const DeleteAccountContainer = styled.div``;

function EditMentorDetails({
  userDetails: { avatar, ...details },
  updateMentor,
  closeModal,
}) {
  const [mentorDetails, setMentorDetails] = useState(fromMtoVM(details));

  // method to update user
  const { updateUser } = useContext(UserContext);

  // textfields onChange function
  const handleInputChange = (fieldName, value) => {
    setMentorDetails({
      ...mentorDetails,
      [fieldName]: value,
    });
  };

  // channels onChange function
  const handleKeyValueChange = (fieldName, prop, value) => {
    const user = { ...mentorDetails };
    const itemIndex = user[fieldName].findIndex(x => x.type === prop);
    const isItemExist = itemIndex > -1;
    if (isItemExist) {
      if (value) {
        user[fieldName] = user[fieldName].map(x => {
          if (x.type === prop) x.id = value;
          return x;
        });
      } else {
        user[fieldName].splice(itemIndex, 1);
      }
    } else {
      user[fieldName].push({
        type: prop,
        id: value,
      });
    }

    setMentorDetails(user);
  };

  const formField = (fieldName, config) => {
    switch (config.type) {
      case 'text':
        return (
          <ExtendedFormField key={fieldName} label={config.label}>
            <Input
              type={config.type}
              name={fieldName}
              value={mentorDetails[fieldName]}
              onChange={e => handleInputChange(fieldName, e.target.value)}
              style={config.style}
            />
          </ExtendedFormField>
        );
      case 'longtext':
        return (
          <ExtendedFormField key={fieldName} label={config.label}>
            <Textarea
              name={fieldName}
              value={mentorDetails[fieldName]}
              onChange={e => handleInputChange(fieldName, e.target.value)}
              style={config.style}
            />
          </ExtendedFormField>
        );
      case 'tags':
      case 'select':
        return (
          <ExtendedFormField key={fieldName} label={config.label}>
            <Select
              name={fieldName}
              isMulti={config.type === 'tags'}
              options={config.options}
              value={mentorDetails[fieldName]}
              onChange={(selected, data) => {
                handleInputChange(data.name, selected);
              }}
            />
          </ExtendedFormField>
        );
      case 'keyvalue':
        const filledChannel = mentorDetails[fieldName].filter(x => x.id);
        return (
          <ExtendedFormField
            key={fieldName}
            label={config.label}
            customFormField
          >
            <HelpText>{config.helpText}</HelpText>
            <InnerFieldsContainer>
              {config.options.map((option, indx) => {
                const propData = mentorDetails[fieldName].find(
                  x => x.type === option.value
                );
                const isDisabled =
                  filledChannel.length >= 3 && !(propData && propData.id);
                return (
                  <ExtendedFormField key={option.value} label={option.label}>
                    <Input
                      aria-labelledby={option.value}
                      type="text"
                      name={`${fieldName}[${option.value}]`}
                      value={propData ? propData.id : ''}
                      onChange={e => {
                        handleKeyValueChange(
                          fieldName,
                          option.value,
                          e.target.value
                        );
                      }}
                      disabled={isDisabled}
                      placeholder={option.placeholder}
                    />
                  </ExtendedFormField>
                );
              })}
            </InnerFieldsContainer>
          </ExtendedFormField>
        );
      case 'checkbox':
        return (
          <ExtendedFormField
            key={fieldName}
            label={config.label}
            customFormField
          >
            <HelpText>{config.helpText}</HelpText>
            <SubFieldContainer>
              <Checkbox
                checked={mentorDetails[fieldName] === true}
                value={mentorDetails[fieldName]}
                onChange={e => {
                  handleInputChange(fieldName, e.target.checked);
                }}
                name={config.label}
                LabelComponent={config.label}
              />
            </SubFieldContainer>
          </ExtendedFormField>
        );
      default:
        return <></>;
    }
  };

  // validate form details
  const validate = () => {
    const errors = [];

    Object.entries(model).forEach(([field, config]) => {
      if (config.validate && !config.validate(mentorDetails[field])) {
        errors.push(config.label);
      } else if (config.options) {
        if (mentorDetails[field] instanceof Array) {
          config.options.forEach(option => {
            const item = mentorDetails[field].find(
              opt => opt.type === option.value
            );
            if (option.validate && item && !option.validate(item.id)) {
              errors.push(`${config.label}:${option.label}`);
            }
          });
        }
      }
    });

    toast.error(
      `The following fields is missing or invalid: ${errors.join(', ')}`
    );
    return !errors.length;
  };

  const onSubmit = e => {
    report('Member Area', 'Submit start', 'User details');
    e.preventDefault();
    if (!validate()) {
      return;
    }
    const userInfo = fromVMtoM(mentorDetails);
    updateMentor(userInfo, updateUser, closeModal);
  };

  const onDelete = async () => {
    report('Member Area', 'Delete start', 'User details');
    if (window.confirm(messages.EDIT_DETAILS_DELETE_ACCOUNT_CONFIRM)) {
      await deleteMentor(details);
      report('Member Area', 'Delete success', 'User details');
      auth.doLogout();
    }
  };

  return (
    <Modal title="Update Profile" onSave={onSubmit} closeModal={closeModal}>
      <EditDetails>
        <EditDetailsForm onSubmit={onSubmit}>
          <FormFields>
            {Object.entries(model).map(([fieldName, field]) =>
              formField(fieldName, field)
            )}
          </FormFields>
        </EditDetailsForm>
        <DeleteAccountContainer>
          <Button skin="danger" onClick={onDelete}>
            Delete my account
          </Button>
        </DeleteAccountContainer>
      </EditDetails>
    </Modal>
  );
}

export default EditMentorDetails;
